import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Copy, 
  Check,
} from "lucide-react";
import { io } from "socket.io-client";
import Peer from "peerjs";
import toast from "react-hot-toast";

function AgriConnect() {
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [peerId, setPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [copied, setCopied] = useState(false);

  const myVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
  
    const initializeConnection = async () => {
      try {
        // Initialize Socket.IO
        socketRef.current = io("http://localhost:5000", {
          transports: ['websocket', 'polling'],
          path: '/socket.io/',
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          autoConnect: true,
          withCredentials: true
        });
  
        // Socket.IO event handlers
        socketRef.current.on('connect', () => {
          console.log('Socket connected:', socketRef.current.id);
          toast.success('Connected to server');
        });
  
        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          toast.error('Connection error. Retrying...');
        });
  
        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Reconnect manually if server disconnected
            socketRef.current.connect();
          }
        });
  
        // Initialize PeerJS
        peerRef.current = new Peer(undefined, {
          host: 'localhost',
          port: 5000,
          path: '/peerjs',
          secure: false,
          debug: 3,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });
  
        peerRef.current.on('open', (id) => {
          if (mounted) {
            setPeerId(id);
            console.log('PeerJS connected with ID:', id);
            toast.success('Ready to make calls');
          }
        });
  
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (mounted) {
          setMyStream(stream);
          if (myVideoRef.current) {
            myVideoRef.current.srcObject = stream;
          }
        }

        // Answer incoming calls
        peerRef.current.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteVideoStream) => {
            setRemoteStream(remoteVideoStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteVideoStream;
            }
            setIsCallActive(true);
          });
          call.on('close', () => {
            endCall();
          });
          call.on('error', (err) => {
            console.error("Call error:", err);
            toast.error("Call failed: " + err.message);
            endCall();
          });
        });
  
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Failed to initialize video call');
      }
    };
  
    initializeConnection();
  
    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCopyPeerId = async () => {
    try {
      await navigator.clipboard.writeText(peerId);
      setCopied(true);
      toast.success("Peer ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy Peer ID");
    }
  };

  const handleCall = () => {
    if (!remotePeerId.trim()) {
      toast.error("Please enter a valid Peer ID");
      return;
    }

    setIsCalling(true);

    try {
      const call = peerRef.current.call(remotePeerId, myStream);

      // Add timeout for call connection
      const callTimeout = setTimeout(() => {
        if (isCalling) {
          toast.error("Call connection timed out");
          setIsCalling(false);
        }
      }, 30000); // 30 second timeout

      call.on("stream", (remoteVideoStream) => {
        clearTimeout(callTimeout);
        setRemoteStream(remoteVideoStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteVideoStream;
        }
        setIsCallActive(true);
        setIsCalling(false);
      });

      call.on("close", () => {
        clearTimeout(callTimeout);
        endCall();
      });

      call.on("error", (err) => {
        clearTimeout(callTimeout);
        console.error("Call error:", err);
        toast.error("Call failed: " + err.message);
        setIsCalling(false);
      });
    } catch (error) {
      console.error("Error making call:", error);
      toast.error("Failed to make call: " + error.message);
      setIsCalling(false);
    }
  };

  const endCall = () => {
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    setRemoteStream(null);
    setIsCallActive(false);
    setIsCalling(false);
  };

  const toggleVideo = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
      >
        AgriConnect Video Call
      </motion.h1>

      {/* Peer ID Display */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-4 bg-gray-800 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Your Peer ID:</h2>
            <p className="text-xl font-mono bg-gray-700 px-4 py-2 rounded-lg">
              {peerId || "Generating..."}
            </p>
          </div>
          <button
            onClick={handleCopyPeerId}
            className="ml-4 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            title="Copy Peer ID"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Share this ID with others to receive calls
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Local Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-2xl bg-gray-800"
          />
          <div className="absolute bottom-4 left-4">
            <p className="text-sm bg-black/50 px-3 py-1 rounded-full">
              Your Video
            </p>
          </div>
        </motion.div>

        {/* Remote Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full rounded-2xl bg-gray-800"
            />
          ) : (
            <div className="w-full h-full min-h-[300px] rounded-2xl bg-gray-800 flex items-center justify-center">
              <p className="text-gray-400">No remote video</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex flex-col items-center gap-6"
      >
        {!isCallActive ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <input
              type="text"
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
              placeholder="Enter Peer ID to call"
              className="w-full px-6 py-3 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleCall}
              disabled={isCalling}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Phone className="w-5 h-5" />
              {isCalling ? "Calling..." : "Start Call"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${
                isVideoEnabled ? "bg-gray-700" : "bg-red-600"
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full ${
                isAudioEnabled ? "bg-gray-700" : "bg-red-600"
              }`}
            >
              {isAudioEnabled ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={endCall}
              className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AgriConnect;
