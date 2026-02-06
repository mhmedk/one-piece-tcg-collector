import CardList from "@/components/CardList";

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
    set: selectedSetLabel = "OP-01",
    q: searchQuery,
    type: typeFilter,
    color: colorFilter,
    rarity: rarityFilter,
  } = await searchParams;

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <CardList
        selectedSetLabel={selectedSetLabel}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        colorFilter={colorFilter}
        rarityFilter={rarityFilter}
      />
    </main>
  );
};

export default Home;
