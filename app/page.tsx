import CardList from "@/components/CardList";
import SideFilter from "@/components/SideFilter";

type PageProps = {
  searchParams: Promise<{
    set?: string;
    q?: string;
    type?: string;
    color?: string;
    rarity?: string;
  }>;
};

const Home = async ({ searchParams }: PageProps) => {
  const {
    set: selectedSetId = "OP-01",
    q: searchQuery,
    type: typeFilter,
    color: colorFilter,
    rarity: rarityFilter,
  } = await searchParams;

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Filter Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r p-4">
        <h2 className="mb-4 text-lg font-semibold">Filter by Set</h2>
        <SideFilter selectedSetId={selectedSetId} />
      </aside>

      {/* Main Content */}
      <CardList
        selectedSetId={selectedSetId}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        colorFilter={colorFilter}
        rarityFilter={rarityFilter}
      />
    </main>
  );
};

export default Home;
