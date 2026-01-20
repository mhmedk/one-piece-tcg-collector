import { Set } from "@/types/set";

const Home = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_OP_API_URL}/allSets`);
  const sets = await response.json();

  console.log("Sets:", sets);
  return (
    <section>
      <h1 className="text-3xl font-bold text-center mt-5">
        One Piece TCG Collector
      </h1>

      <div className="mt-20 space-y-7">
        <h3 className="text-xl font-semibold ml-5">Available Sets</h3>

        <ul>
          {sets.map((set: Set) => (
            <li key={set.set_id}>{set.set_name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Home;
