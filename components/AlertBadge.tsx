type Props = {
  quantity: number;
  threshold: number;
};

export default function AlertBadge({ quantity, threshold }: Props) {
  if (quantity <= threshold) {
    return (
      <span className="inline-flex items-center justify-center w-full h-full bg-red-100 text-red-700 font-bold text-sm rounded">
        {quantity}
      </span>
    );
  }
  if (quantity <= threshold * 1.2) {
    return (
      <span className="inline-flex items-center justify-center w-full h-full bg-amber-100 text-amber-700 font-semibold text-sm rounded">
        {quantity}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-full h-full text-sm text-gray-700">
      {quantity}
    </span>
  );
}
