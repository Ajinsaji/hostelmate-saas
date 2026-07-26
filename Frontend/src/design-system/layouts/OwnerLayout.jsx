import { useState } from "react";
import { TopHeader } from "../components/TopHeader";
import { AISearchBar } from "../components/AISearchBar";
import { BottomNavigation } from "../components/BottomNavigation";
import { colors } from "../tokens/colors";

export function OwnerLayout({ children, ownerPhotoUrl, notificationCount = 0 }) {
  const [aiQuery, setAiQuery] = useState("");

  const handleMenuClick = () => {
    // Open drawer logic
    console.log("Menu clicked");
  };

  const handleFabClick = () => {
    // Open Quick Add sheet
    console.log("FAB clicked");
  };

  return (
    <div 
      className="min-h-screen w-full relative pb-24"
      style={{ background: colors.bg, color: colors.textPrimary }}
    >
      <TopHeader 
        onMenuClick={handleMenuClick} 
        ownerPhotoUrl={ownerPhotoUrl} 
        notificationCount={notificationCount} 
      />
      
      <AISearchBar 
        value={aiQuery} 
        onChange={(e) => setAiQuery(e.target.value)} 
      />

      <main className="w-full">
        {children}
      </main>

      <BottomNavigation onFabClick={handleFabClick} />
    </div>
  );
}
