import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-site grid min-h-[60vh] content-center gap-6 py-24">
      <p className="eyebrow"><span className="num">404</span>Wrong turn</p>
      <h1 className="display-md">This road doesn&apos;t go anywhere</h1>
      <p className="lede">The page you were looking for has moved or never existed.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/cars" className="btn btn-primary">Browse the fleet</Link>
        <Link href="/" className="btn btn-secondary">Home</Link>
      </div>
    </div>
  );
}
