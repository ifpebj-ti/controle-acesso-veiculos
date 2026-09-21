import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

export async function selectFieldOption(
  user: UserEvent,
  control: Element,
  value: string,
) {
  await user.click(control);
  const options = await screen.findAllByRole("option");
  const option = options.find((candidate) => candidate.dataset.value === value);

  if (!option) {
    throw new Error(`Select option with value "${value}" was not found.`);
  }

  await user.click(option);
}
