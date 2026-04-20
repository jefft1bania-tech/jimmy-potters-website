'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-faire !w-auto"
    >
      Print
    </button>
  );
}
