"use client";

type InventoryProps = {
  name: string;
  imageUrl: string;
  isEquipped: boolean;
};

export default function InventoryItemCard({
  name,
  imageUrl,
  isEquipped,
}: InventoryProps) {
  return (
    <div
      className={`
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
            ? "border-green-400 bg-green-500/20"
            : "border-white/20 bg-white/10 hover:bg-white/20"
        }
      `}
    >
      {/* <p>{name}</p> */}
      <img
        src={imageUrl}
        alt={name}
        className="w-12 h-12 object-contain"
        draggable={false}
      />
    </div>
  );
}
