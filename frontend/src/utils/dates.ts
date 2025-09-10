import dayjs from "dayjs";

export const toPlainRange = (from: string, to: string) => ({
  from: dayjs(from).format("YYYY-MM-DD"),
  to: dayjs(to).format("YYYY-MM-DD"),
});

export const toIsoRange = (from: string, to: string) => ({
  from: dayjs(from).startOf("day").toISOString(),
  to: dayjs(to).endOf("day").toISOString(),
});
