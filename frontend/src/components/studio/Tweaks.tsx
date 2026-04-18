import { Icons } from "./Icons";
import { IconBtn, NumInput, Row, Seg, Slider } from "./Primitives";

export interface TweaksState {
  accentHue: number;
  variationCount: number;
  showGrid: boolean;
  clientDemo: "tidalwave" | "vervo";
}

export const TWEAK_DEFAULTS: TweaksState = {
  accentHue: 265,
  variationCount: 3,
  showGrid: true,
  clientDemo: "tidalwave",
};

export interface TweaksProps {
  tweaks: TweaksState;
  setTweaks: (next: TweaksState) => void;
  visible: boolean;
  onClose: () => void;
}

export function Tweaks({ tweaks, setTweaks, visible, onClose }: TweaksProps) {
  if (!visible) return null;

  const set = <K extends keyof TweaksState>(key: K, value: TweaksState[K]) => {
    setTweaks({ ...tweaks, [key]: value });
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { [key]: value } },
      "*",
    );
  };

  return (
    <div className="absolute bottom-[120px] right-[16px] z-[80] w-[260px] rounded-l border border-line-2 bg-bg-2 shadow-toolbar">
      <div className="flex items-center border-b border-line-1 py-2 pl-3 pr-[10px]">
        <span className="mono flex-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-text-1">
          Tweaks
        </span>
        <IconBtn onClick={onClose} title="Close" size={20}>
          {Icons.close}
        </IconBtn>
      </div>
      <div className="flex flex-col gap-3 p-3">
        <Row label="Accent">
          <Slider
            value={tweaks.accentHue}
            min={0}
            max={360}
            onChange={(value) => set("accentHue", value)}
          />
          <NumInput value={tweaks.accentHue} suffix="°" width={54} />
        </Row>
        <Row label="Variations">
          <Seg<number>
            value={tweaks.variationCount}
            onChange={(value) => set("variationCount", value)}
            options={[
              { value: 2, label: "2" },
              { value: 3, label: "3" },
              { value: 4, label: "4" },
            ]}
          />
        </Row>
        <Row label="Grid">
          <Seg<string>
            value={tweaks.showGrid ? "on" : "off"}
            onChange={(value) => set("showGrid", value === "on")}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />
        </Row>
        <Row label="Demo">
          <Seg<TweaksState["clientDemo"]>
            value={tweaks.clientDemo}
            onChange={(value) => set("clientDemo", value)}
            options={[
              { value: "tidalwave", label: "Fintech" },
              { value: "vervo", label: "SaaS" },
            ]}
          />
        </Row>
      </div>
    </div>
  );
}
