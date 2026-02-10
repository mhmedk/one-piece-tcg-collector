import CardList from "@/components/CardList";

type PageProps = {
  searchParams: Promise<{
    set?: string;
    q?: string;
    type?: string;
    color?: string;
    rarity?: string;
    sort?: string;
  }>;
};

const Home = async ({ searchParams }: PageProps) => {
  const {
    set: selectedSet = "all",
    q: searchQuery,
    type: typeFilter,
    color: colorFilter,
    rarity: rarityFilter,
    sort: sortBy = "set",
  } = await searchParams;

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <CardList
        selectedSet={selectedSet}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        colorFilter={colorFilter}
        rarityFilter={rarityFilter}
        sortBy={sortBy}
      />
    </main>
  );
};

export default Home;
