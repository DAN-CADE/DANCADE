"use client";

type InventoryProps = {
  name: string;
  imageUrl: string;
  isEquipped: boolean;
    onDoubleClick?: () => void;
};

export default function InventoryItemCard({
  name,
  imageUrl,
  isEquipped,
  onDoubleClick,
}: InventoryProps) {
  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`
        title="더블클릭으로 장착"
        role="button"
        h-[72px]
        rounded
        flex
        items-center
        justify-center
        cursor-pointer
        transition
        select-none
        border
        ${
          isEquipped
            ? "border-blue-400 bg-blue-500/20"
            : "border-white/20 bg-white/10 hover:bg-white/20"
        }
      `}
    >
      <p>{name}</p>
      {/* <img
        src={imageUrl}
        alt={name}
        className="w-12 h-12 object-contain"
        draggable={false}
      /> */}
    </div>
  );
}
