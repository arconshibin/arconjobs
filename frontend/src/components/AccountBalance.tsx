import { Progress } from "@heroui/react";

const AccountBalance = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
      <div className="text-3xl font-bold mb-4">$1,423.25</div>
      <div className="flex justify-between text-sm text-foreground-500 mb-2">
        <span>Monthly Credits</span>
        <span>$500.00</span>
      </div>
      <div className="flex justify-between text-sm text-foreground-500 mb-2">
        <span>Usage This Month</span>
        <span>$76.75</span>
      </div>
      <Progress value={15} className="mt-2" />
    </div>
  );
};

export default AccountBalance;