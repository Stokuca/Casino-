
import { usePlayerWallet } from "../../hooks/usePlayerWallet";
import BalanceCard from "./BalanceCard";
import BettingSimulator from "./BettingSimulator";
import StatusAlert from "./StatusAlert";
import WalletPanel from "./WalletPanel";

export default function PlayerDashboard() {
  const { niceBalance, busy, status, setStatus, deposit, withdraw, play } = usePlayerWallet();

  return (
    <div className="space-y-6">
      <BalanceCard value={niceBalance} />

      <WalletPanel busy={busy} onDeposit={deposit} onWithdraw={withdraw} />

      <BettingSimulator busy={busy} onPlay={play} />

      {status && <StatusAlert text={status} onClose={() => setStatus(null)} />}
    </div>
  );
}
