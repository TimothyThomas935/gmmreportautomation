import Link from "next/link";
import NameAutocomplete from "./NameAutocomplete";

type Miner = {
  FirstName: string;
  LastName: string;
  TagID: string;
};

const Header = ({
  title,
  searchValue,
  onSearchChange,
  onSelect,
}: {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect?: (miner: Miner) => void;
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow px-4 py-3 flex flex-wrap items-center text-black justify-between gap-2">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold whitespace-nowrap">{title}</h1>
      </div>

      <NameAutocomplete
        value={searchValue}
        onChange={onSearchChange}
        onSelect={onSelect}
      />
      <div>
        <Link
          href="/"
          className="bg-gray-200 text-sm px-4 py-2 rounded hover:bg-green-700 whitespace-nowrap m-4"
        >
          Home
        </Link>

        <Link
          href="/movementReport"
          className="bg-green-600 text-sm px-4 py-2 rounded hover:bg-green-700 whitespace-nowrap"
        >
            Movement Report
        </Link>
      </div>
    </header>
  );
};

export default Header;
