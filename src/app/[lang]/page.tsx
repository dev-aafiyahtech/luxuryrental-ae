import s from "@/components/home/probe.module.css";
export default function Home() {
  return <p className={s.probe} data-probe={JSON.stringify(s)}>probe</p>;
}
