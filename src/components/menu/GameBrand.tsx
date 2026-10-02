/** Preserve the upstream mark while clearly identifying the mobile edition. */
export function GameBrand() {
  return (
    <div role="img" aria-label="OFMtouch" className="flex w-full flex-col items-end">
      <img src="/openfootlogo.svg" alt="" className="h-auto w-full object-contain" />
      <img
        src="/ofmtouch-wordmark.png"
        alt=""
        width={2172}
        height={724}
        className="-mt-2 h-auto w-2/3 object-contain"
      />
    </div>
  );
}
