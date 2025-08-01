import StickerPeel from "./components/StickerPeel";
import batman from "@/public/batman.svg";
import joker from "@/public/joker.svg";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden relative">
      <div className="absolute inset-0">
        <StickerPeel
          imageSrc={batman.src}
          width={200}
          rotate={30}
          peelBackHoverPct={20}
          peelBackActivePct={20}
          shadowIntensity={0.1}
          lightingIntensity={0.1}
          initialPosition={{ x: 20, y: 60 }}
        />
        <StickerPeel
          imageSrc={joker.src}
          width={200}
          rotate={30}
          peelBackHoverPct={20}
          peelBackActivePct={20}
          shadowIntensity={0.7}
          lightingIntensity={0.1}
          initialPosition={{ x: 220, y: 60 }}
        />
      </div>
    </main>
  );
}

