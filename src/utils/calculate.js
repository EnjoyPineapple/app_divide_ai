export function calculateResults(participants, payments) {
  if (participants.length === 0) return [];

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const share = total / participants.length;

  const balances = participants.map(p => {
    const paid = payments
      .filter(pay => pay.participantId === p.id)
      .reduce((sum, pay) => sum + pay.amount, 0);
    return { id: p.id, name: p.name, paid, balance: paid - share };
  });

  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

  const transactions = [];
  let i = 0, j = 0;
  const cred = creditors.map(c => ({ ...c }));
  const debt = debtors.map(d => ({ ...d }));

  while (i < cred.length && j < debt.length) {
    const amount = Math.min(cred[i].balance, -debt[j].balance);
    transactions.push({
      from: debt[j].name,
      to: cred[i].name,
      amount: parseFloat(amount.toFixed(2)),
    });
    cred[i].balance -= amount;
    debt[j].balance += amount;
    if (Math.abs(cred[i].balance) < 0.01) i++;
    if (Math.abs(debt[j].balance) < 0.01) j++;
  }

  return { total, share, balances, transactions };
}
