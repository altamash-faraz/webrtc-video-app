# WebRTC Video App

A modern, real-time video calling application built with **Next.js 16**, **React 19**, and **WebRTC**. Features peer-to-peer video calls with HD quality, secure connections, and an intuitive user interface.

![WebRTC Video App](https://img.shields.io/badge/WebRTC-Video%20Calling-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## ✨ Features

- 🎥 **HD Video Calling** - Crystal clear video quality with adaptive bitrate
- 🔒 **Secure & Private** - End-to-end encrypted peer-to-peer connections
- 🎛️ **Call Controls** - Mute/unmute, video on/off, call management
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🌙 **Dark Mode** - Beautiful UI with dark/light theme support
- 🔗 **Room-based** - Simple room ID sharing system
- ⚡ **Real-time** - Low-latency communication using WebRTC
- 🎯 **No Downloads** - Works directly in the browser

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webrtc-video-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 How to Use

1. **Enter your name** and either create a new room or join an existing one
2. **Allow camera and microphone access** when prompted by your browser
3. **Share the room ID** with the person you want to call
4. **Start your video call** once they join the room

### Room Controls

- 🎤 **Mute/Unmute** - Toggle your microphone
- 📹 **Video On/Off** - Toggle your camera
- ☎️ **End Call** - Leave the room and end the call

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **WebRTC**: Native Web APIs
- **Real-time**: Custom signaling implementation

### Key Components

```
src/
├── app/
│   ├── page.tsx              # Home page with room selector
│   ├── room/[roomId]/        # Dynamic video call room
│   └── layout.tsx            # Root layout
├── components/
│   ├── VideoPlayer.tsx       # Video display component
│   ├── CallControls.tsx      # Call control buttons
│   ├── RoomSelector.tsx      # Room creation/joining
│   └── ErrorBoundary.tsx     # Error handling
└── hooks/
    ├── useWebRTC.ts          # WebRTC management hook
    └── useSignaling.ts       # Signaling logic hook
```

### WebRTC Flow

1. **Media Access** - Request camera/microphone permissions
2. **Peer Connection** - Establish RTCPeerConnection
3. **Signaling** - Exchange offer/answer and ICE candidates
4. **Media Stream** - Share audio/video tracks
5. **Connection** - Start real-time communication

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for custom configuration:

```env
# Optional: Custom STUN/TURN servers
NEXT_PUBLIC_STUN_SERVER_1=stun:stun.l.google.com:19302
NEXT_PUBLIC_STUN_SERVER_2=stun:stun1.l.google.com:19302

# Optional: WebSocket signaling server URL
NEXT_PUBLIC_SIGNALING_URL=ws://localhost:3001
```

### Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 14+
- ✅ Edge 79+

**Note**: HTTPS is required for camera/microphone access in production.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy with Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your repository
   - Deploy automatically

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🔄 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Adding Features

1. **Screen Sharing** - Extend `useWebRTC` hook
2. **Chat Messages** - Use WebRTC data channels
3. **File Sharing** - Implement file transfer over data channels
4. **Multiple Participants** - Add mesh or SFU architecture

## 🐛 Troubleshooting

### Common Issues

**Camera/Microphone not working**
- Ensure HTTPS in production
- Check browser permissions
- Verify device availability

**Connection fails**
- Check firewall settings
- Verify STUN/TURN server configuration
- Enable browser developer tools for debugging

**Audio/Video quality issues**
- Check network bandwidth
- Verify camera/microphone hardware
- Consider adjusting video constraints

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions and support:
- 📧 Open an issue on GitHub
- 💬 Check existing discussions
- 📖 Review the documentation

---

**Built with ❤️ using Next.js and WebRTC**
