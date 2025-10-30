import imgLogo from "figma:asset/35d2507d0156c2fcfac53266ae8b84da98faa808.png";

function Logo() {
  return <div className="absolute bg-[71.47%_52.84%] bg-no-repeat bg-size-[218.93%_258.5%] h-[54.382px] left-[81.57px] top-0 w-[138.427px] text-white" data-name="logo" style={{ backgroundImage: `url('${imgLogo}')` }} />;
}

function Logo1() {
  return <div className="absolute bg-[16.56%_53.66%] bg-no-repeat bg-size-[408.16%_265.06%] h-[53.146px] left-0 top-[1.24px] w-[74.404px]" data-name="logo" style={{ backgroundImage: `url('${imgLogo}')` }} />;
}

export default function Group1() {
  return (
    <div className="relative size-full">
      <Logo />
      <Logo1 />
    </div>
  );
}