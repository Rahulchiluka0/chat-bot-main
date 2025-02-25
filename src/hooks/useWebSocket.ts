import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const getUUIDFromCookies = (): string | null => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === "uuid") {
      return value;
    }
  }
  return null;
};

const useWebSocket = () => {
  const [stompClient, setStompClient] = useState<any>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  // Use a ref to ensure the subscription is only set up once.
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return; // Already subscribed
    subscribedRef.current = true;

    const uuid = getUUIDFromCookies();
    const url = "http://192.168.29.156:8080/meta/api/websocket";
    const socket = new SockJS(url);
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect({ pageId: uuid || "default" }, (frame: any) => {
      console.log("STOMP Connected: " + frame);
      setStompClient(client);
      setIsConnected(true);

      client.subscribe(
        `/user/0a6ad088-f2ee-4611-80d5-5c1170d7fb7e/bot-agent/messages`,
        (message) => {
          console.log("Received via STOMP:", message.body);
          // console.log("Received via STOMP:", JSON.parse(message.body).message.greeting);

          if (JSON.parse(message.body).message.url) {
            try {
              // The URL field is a JSON string; parse it.
              const urlData = JSON.parse(JSON.parse(message.body).message.url);
              // Check that the status is "FOUND" and a detail URL exists.
              if (urlData.status === "FOUND" && urlData.detail) {
                // Redirect the parent window (i.e. load the URL in the current tab behind the chatbot).
                window.parent.postMessage({ redirect: urlData.detail }, "*");
              }
            } catch (error) {
              console.error("Error parsing URL:", error);
            }
          }

          setMessages((prev) => [...prev, message.body]);
        }
      );
    }, (error: any) => {
      console.error("STOMP Connection error:", error);
      setIsConnected(false);
    });

    return () => {
      if (client && client.connected) {
        client.disconnect(() => {
          console.log("STOMP Disconnected");
        });
      }
    };
  }, []);

  const sendMessage = (message: string) => {
    if (stompClient && stompClient.connected) {
      const chatMessage = {
        from: "0a6ad088-f2ee-4611-80d5-5c1170d7fb7e",
        to: null,
        timestamp: Date.now(),
        message,
      };
      stompClient.send("/app/help.chat", {}, JSON.stringify(chatMessage));
    } else {
      console.error("STOMP client is not connected yet.");
    }
  };

  return { messages, sendMessage, isConnected };
};

export default useWebSocket;
