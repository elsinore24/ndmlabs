"use client";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/starscapes-visual-riddles/id6756834182";
const ITMS_URL =
  "itms-apps://apps.apple.com/us/app/starscapes-visual-riddles/id6756834182";

export default function AppStoreLink() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Try opening the App Store app directly via itms-apps:// protocol.
    // This bypasses in-app browsers (TikTok, Instagram, etc.) that block
    // regular apps.apple.com links.
    window.location.href = ITMS_URL;

    // Fallback: if still on the page after 1.5s, try the regular URL
    setTimeout(() => {
      window.location.href = APP_STORE_URL;
    }, 1500);
  };

  return (
    <a
      href={APP_STORE_URL}
      onClick={handleClick}
      className="link-card app-store delay-2"
    >
      <img src="/starscapes-icon.png" alt="Starscapes" className="app-icon" />
      <div className="link-content">
        <div className="title">Starscapes: Visual Riddles</div>
        <img
          src="/appstore_button.png"
          alt="Download on the App Store"
          className="appstore-badge"
        />
      </div>
    </a>
  );
}
