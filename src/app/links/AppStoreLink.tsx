import StoreLink from "@/components/StoreLink";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/starscapes-rebus-puzzles/id6756834182";

export default function AppStoreLink() {
  return (
    <StoreLink href={APP_STORE_URL} className="link-card app-store delay-2">
      <img src="/starscapes-icon.png" alt="Starscapes" className="app-icon" />
      <div className="link-content">
        <div className="title">Starscapes: Rebus Puzzles</div>
        <img
          src="/appstore_button.png"
          alt="Download on the App Store"
          className="appstore-badge"
        />
      </div>
    </StoreLink>
  );
}
