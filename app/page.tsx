import CardList from "@/components/CardList";
import SideFilter from "@/components/SideFilter";

type PageProps = {
  searchParams: Promise<{ set?: string }>;
};

const Home = async ({ searchParams }: PageProps) => {
  const { set: selectedSetId = "OP-01" } = await searchParams;

  return (
    <main className="flex">
      {/* Filter Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 p-4">
        <h2 className="mb-4 text-lg font-semibold">Filter by Set</h2>
        <SideFilter selectedSetId={selectedSetId} />
      </aside>

      {/* Main Content */}
      <CardList selectedSetId={selectedSetId} />
    </main>
  );
};

export default Home;
