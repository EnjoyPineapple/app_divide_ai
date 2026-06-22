export function calculateResults(participants, payments, families = []) {
  if (participants.length === 0) return { total: 0, share: 0, balances: [], transactions: [] };

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const share = total / participants.length;

  // dependent id → head id
  const dependentToHead = {};
  families.forEach(f => {
    f.memberIds.forEach(mId => { dependentToHead[mId] = f.headId; });
  });

  // individual balance for every participant
  const individual = {};
  participants.forEach(p => {
    const paid = payments
      .filter(pay => pay.participantId === p.id)
      .reduce((s, pay) => s + pay.amount, 0);
    individual[p.id] = { id: p.id, name: p.name, paid, balance: paid - share };
  });

  // accumulate dependents' balance onto their head
  const headExtra = {};
  Object.entries(dependentToHead).forEach(([depId, headId]) => {
    headExtra[headId] = (headExtra[headId] || 0) + (individual[depId]?.balance ?? 0);
  });

  // build final balances preserving participant order
  const balances = participants.map(p => {
    const isDependent = !!dependentToHead[p.id];

    if (isDependent) {
      const headId = dependentToHead[p.id];
      const headName = participants.find(x => x.id === headId)?.name ?? '';
      return { ...individual[p.id], balance: 0, isCovered: true, coveredByName: headName };
    }

    const isHead = families.some(f => f.headId === p.id);
    const coveredMembers = isHead
      ? families
          .filter(f => f.headId === p.id)
          .flatMap(f => f.memberIds)
          .map(mId => participants.find(x => x.id === mId)?.name)
          .filter(Boolean)
      : [];

    return {
      ...individual[p.id],
      balance: individual[p.id].balance + (headExtra[p.id] || 0),
      isHead,
      coveredMembers,
    };
  });

  // transactions only between non-dependents
  const active = balances.filter(b => !b.isCovered);
  const creditors = active.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors   = active.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

  const transactions = [];
  const cred = creditors.map(c => ({ ...c }));
  const debt = debtors.map(d => ({ ...d }));
  let i = 0, j = 0;

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
