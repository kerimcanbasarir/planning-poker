"use client";

import { CardSetType } from "@/types";

interface StoryPointTableProps {
  cardSetType: CardSetType;
}

const fibonacciDescriptions: Record<string, string> = {
  "0": "Efor yok",
  "1": "Çok küçük",
  "2": "Küçük",
  "3": "Orta",
  "5": "Büyük",
  "8": "Çok büyük",
  "13": "Devasa",
  "21": "Epik",
  "34": "Bölünmeli",
};

const tshirtDescriptions: Record<string, string> = {
  "XS": "Çok küçük",
  "S": "Küçük",
  "M": "Orta",
  "L": "Büyük",
  "XL": "Çok büyük",
  "XXL": "Devasa",
};

export default function StoryPointTable({ cardSetType }: StoryPointTableProps) {
  const descriptions = cardSetType === "fibonacci" ? fibonacciDescriptions : tshirtDescriptions;

  return (
    <div className="p-4 border-t border-gray-800">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Referans Tablosu</h3>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(descriptions).map(([point, desc]) => (
            <tr key={point} className="border-b border-gray-800/50">
              <td className="py-1 pr-3 font-mono font-bold text-white">{point}</td>
              <td className="py-1 text-gray-400">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
