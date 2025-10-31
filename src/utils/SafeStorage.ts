/**
 * SafeStorage - A wrapper around localStorage with quota management
 */

export class SafeStorage {
  private static readonly QUOTA_EXCEEDED_ERRORS = [
    'QuotaExceededError',
    'NS_ERROR_DOM_QUOTA_REACHED',
    'QUOTA_EXCEEDED_ERR'
  ];

  /**
   * Safely set an item in localStorage with automatic cleanup on quota exceeded
   */
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        
        // Try to free up space by removing old room data
        this.cleanupOldRooms();
        
        // Try again after cleanup
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          // If still failing, remove this specific key's old data
          if (key.startsWith('room_')) {
            console.warn('Clearing current room data to make space...');
            localStorage.removeItem(key);
            
            // Try with minimal data
            try {
              localStorage.setItem(key, value);
              return true;
            } catch (finalError) {
              console.error('Failed to save even after aggressive cleanup:', finalError);
              return false;
            }
          }
        }
      } else {
        console.error('localStorage error:', error);
      }
      return false;
    }
  }

  /**
   * Safely get an item from localStorage
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove an item from localStorage
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  /**
   * Check if the error is a quota exceeded error
   */
  private static isQuotaExceededError(error: any): boolean {
    return (
      error instanceof DOMException &&
      this.QUOTA_EXCEEDED_ERRORS.includes(error.name)
    );
  }

  /**
   * Clean up old room data to free space
   */
  private static cleanupOldRooms(): void {
    try {
      const roomKeys: string[] = [];
      const roomData: Array<{ key: string; timestamp: number }> = [];

      // Find all room keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('room_')) {
          roomKeys.push(key);
          
          // Get timestamp of the most recent message in this room
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const messages = JSON.parse(data);
              const lastTimestamp = messages.length > 0 
                ? Math.max(...messages.map((m: any) => m.timestamp || 0))
                : 0;
              roomData.push({ key, timestamp: lastTimestamp });
            } catch {
              // If we can't parse it, consider it old
              roomData.push({ key, timestamp: 0 });
            }
          }
        }
      }

      // Sort by timestamp (oldest first) and remove old rooms
      roomData.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 50% of rooms or at least 2 rooms
      const toRemove = Math.max(2, Math.floor(roomData.length / 2));
      for (let i = 0; i < toRemove && i < roomData.length; i++) {
        console.log('Removing old room data:', roomData[i].key);
        localStorage.removeItem(roomData[i].key);
      }
    } catch (error) {
      console.error('Error during localStorage cleanup:', error);
      // As a last resort, clear all room data
      this.clearAllRoomData();
    }
  }

  /**
   * Clear all room data (emergency cleanup)
   */
  private static clearAllRoomData(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('room_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('Cleared all room data from localStorage');
    } catch (error) {
      console.error('Error clearing room data:', error);
    }
  }

  /**
   * Get storage usage information
   */
  static getUsageInfo(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate total quota (usually 5-10MB, we'll estimate 5MB)
      const estimatedTotal = 5 * 1024 * 1024; // 5MB
      const percentage = (used / estimatedTotal) * 100;

      return { used, total: estimatedTotal, percentage };
    } catch (error) {
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}