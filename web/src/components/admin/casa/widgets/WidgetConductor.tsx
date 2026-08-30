"use client";

type Props = {
  localLabel: string;
  onLocalGo: () => void;
};

/** Default AVANTI: always a single big GO button. Live phase chrome is `transport`. */
export function WidgetConductor({ localLabel, onLocalGo }: Props) {
  return (
    <div className="casa-conductor-local">
      <button type="button" className="casa-go" onClick={onLocalGo}>
        {localLabel}
      </button>
    </div>
  );
}
