import { SafeStorage } from '@/utils/SafeStorage';

/**
 * Utility functions for managing room data and storage
 */
export class RoomManager {
  /**
   * Clear all room data from localStorage
   */
  static clearAllRoomData(): void {
    try {
      const keysToRemove: string[] = [];
      
      // Use SafeStorage to iterate through keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('room_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        SafeStorage.removeItem(key);
      });
      
      console.log(`Cleared ${keysToRemove.length} room(s) from storage`);
    } catch (error) {
      console.error('Error clearing room data:', error);
    }
  }

  /**
   * Clear data for a specific room
   */
  static clearRoomData(roomId: string): void {
    SafeStorage.removeItem(`room_${roomId}`);
    console.log(`Cleared data for room: ${roomId}`);
  }

  /**
   * Get all active room IDs
   */
  static getActiveRooms(): string[] {
    const roomIds: string[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('room_')) {
          const roomId = key.replace('room_', '');
          roomIds.push(roomId);
        }
      }
    } catch (error) {
      console.error('Error getting active rooms:', error);
    }
    
    return roomIds;
  }

  /**
   * Get storage usage summary
   */
  static getStorageSummary(): {
    totalRooms: number;
    storageUsage: ReturnType<typeof SafeStorage.getUsageInfo>;
    roomSizes: Array<{ roomId: string; size: number; messageCount: number }>;
  } {
    const rooms = this.getActiveRooms();
    const roomSizes: Array<{ roomId: string; size: number; messageCount: number }> = [];
    
    rooms.forEach(roomId => {
      try {
        const data = SafeStorage.getItem(`room_${roomId}`);
        if (data) {
          const messages = JSON.parse(data);
          roomSizes.push({
            roomId,
            size: data.length,
            messageCount: Array.isArray(messages) ? messages.length : 0
          });
        }
      } catch (error) {
        console.error(`Error analyzing room ${roomId}:`, error);
      }
    });

    return {
      totalRooms: rooms.length,
      storageUsage: SafeStorage.getUsageInfo(),
      roomSizes: roomSizes.sort((a, b) => b.size - a.size) // Sort by size, largest first
    };
  }
}

// Add global function for debugging (can be called from browser console)
if (typeof window !== 'undefined') {
  (window as any).RoomManager = RoomManager;
}