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
  if (quantity <= Math.ceil(threshold * 1.5)) {
    return (
      <span className="inline-flex items-center justify-center w-full h-full bg-yellow-100 text-yellow-700 font-semibold text-sm rounded">
        {quantity}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-full h-full bg-green-100 text-green-700 font-semibold text-sm rounded">
      {quantity}
    </span>
  );
}
