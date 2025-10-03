import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css"; // App.cssをインポート
import { GoogleOAuthProvider } from "@react-oauth/google";

// バックエンドの main.py で設定したクライアントIDと同じものを設定
const GOOGLE_CLIENT_ID = "836421431313-gvb58qo9abkiu7lbiuqpqfqe9egte9j3.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);