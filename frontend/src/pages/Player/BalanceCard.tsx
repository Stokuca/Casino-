export default function BalanceCard({ value }: { value: string }) {
    return (
      <section className="rounded-2xl border bg-white/60 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="mt-1 text-3xl font-semibold">{value}</p>
          </div>
          <span className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white">RTP weighted play</span>
        </div>
      </section>
    );
  }
  