export async function getDashboardOverview() {

  const response =
    await fetch("/api/dashboard/overview");


  if (!response.ok) {
    throw new Error(
      "Failed to fetch dashboard overview"
    );
  }


  return response.json();

}