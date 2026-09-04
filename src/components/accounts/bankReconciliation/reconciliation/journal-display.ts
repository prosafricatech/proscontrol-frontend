export interface JournalLike {
  description?: string | null;
  voucher_no?: string | null;
  counterparty?: string | null;
}

/**
 * Whether the journal's own free-text description already spells out its
 * voucher number (a common habit when recording a receipt/payment
 * manually) — in which case showing voucher_no as its own separate field
 * next to it would just repeat the same text.
 */
export const descriptionIncludesVoucher = (journal: JournalLike): boolean =>
  !!journal.voucher_no && !!journal.description?.toLowerCase().includes(journal.voucher_no.toLowerCase());

/**
 * The identifying parts of a journal (voucher number, counterparty ledger,
 * description) with the voucher number dropped whenever the description
 * already contains it, so callers never have to repeat that check.
 */
export const journalDisplayParts = (journal: JournalLike): string[] => {
  const parts = [
    descriptionIncludesVoucher(journal) ? null : journal.voucher_no,
    journal.counterparty,
    journal.description,
  ];
  return parts.filter((part): part is string => !!part);
};
