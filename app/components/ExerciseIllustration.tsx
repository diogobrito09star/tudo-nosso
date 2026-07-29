const STROKE = "#211d18";
const HIGHLIGHT = "#c9622f";

function Head({ cx, cy }: { cx: number; cy: number }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r="10"
      fill="none"
      stroke={STROKE}
      strokeWidth="5"
    />
  );
}

/** Deitado, tronco desce com o braço. Usado em flexão normal e diamante. */
function PoseFlexao() {
  return (
    <g className="pose-flexao">
      <Head cx={30} cy={70} />
      <ellipse cx="85" cy="72" rx="45" ry="9" fill={HIGHLIGHT} opacity="0.35" />
      <g className="pose-flexao-body">
        <line x1="40" y1="70" x2="130" y2="78" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <line x1="130" y1="78" x2="150" y2="100" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <line x1="55" y1="72" x2="60" y2="105" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Pendurado numa barra, sobe. Costas laterais + bicep. */
function PoseElevacao() {
  return (
    <g>
      <line x1="30" y1="20" x2="130" y2="20" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      <g className="pose-elevacao-body">
        <Head cx={80} cy={55} />
        <ellipse cx="80" cy="85" rx="16" ry="26" fill={HIGHLIGHT} opacity="0.35" />
        <line x1="80" y1="65" x2="80" y2="115" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="22" x2="72" y2="70" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
        <line x1="100" y1="22" x2="88" y2="70" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** De pé, compacto, entre barras, braço quase vertical. Peito + tricep. */
/** Pendurado numa barra, pega mais estreita, sobe. Foco nos braços (bicep). */
function PoseChinups() {
  return (
    <g>
      <line x1="30" y1="20" x2="130" y2="20" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      <g className="pose-chinups-body">
        <Head cx={80} cy={50} />
        <line x1="80" y1="60" x2="80" y2="110" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="68" cy="45" rx="10" ry="20" fill={HIGHLIGHT} opacity="0.4" />
        <ellipse cx="92" cy="45" rx="10" ry="20" fill={HIGHLIGHT} opacity="0.4" />
        <g className="pose-chinups-arms">
          <line x1="68" y1="22" x2="72" y2="65" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
          <line x1="92" y1="22" x2="88" y2="65" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

function PoseDips() {
  return (
    <g>
      <line x1="35" y1="30" x2="35" y2="110" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      <line x1="125" y1="30" x2="125" y2="110" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      <g className="pose-dips-body">
        <Head cx={80} cy={45} />
        <ellipse cx="80" cy="72" rx="20" ry="20" fill={HIGHLIGHT} opacity="0.35" />
        <line x1="80" y1="55" x2="80" y2="90" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <line x1="35" y1="55" x2="70" y2="80" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
        <line x1="125" y1="55" x2="90" y2="80" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Seta invertida, cu para cima. Ombros. */
function PosePique() {
  return (
    <g>
      <ellipse cx="80" cy="55" rx="24" ry="14" fill={HIGHLIGHT} opacity="0.4" />
      <path
        d="M 40 100 L 80 55 L 120 100"
        fill="none"
        stroke={STROKE}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <Head cx={80} cy={95} />
      <g className="pose-pique-arms">
        <line x1="60" y1="70" x2="55" y2="100" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
        <line x1="100" y1="70" x2="105" y2="100" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Inclinado, pés no chão, peito perto da barra. Costas + bicep. */
function PoseBarra() {
  return (
    <g>
      <line x1="20" y1="35" x2="140" y2="35" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      <g className="pose-barra-body">
        <Head cx={45} cy={55} />
        <ellipse cx="80" cy="65" rx="35" ry="10" fill={HIGHLIGHT} opacity="0.35" />
        <line x1="55" y1="55" x2="120" y2="75" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <line x1="120" y1="75" x2="115" y2="115" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="45" x2="65" y2="36" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Deitado, só o cotovelo mexe. Tricep. */
function PoseTricep() {
  return (
    <g>
      <Head cx={25} cy={60} />
      <line x1="35" y1="60" x2="120" y2="68" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      <line x1="120" y1="68" x2="140" y2="90" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="95" cy="62" rx="16" ry="8" fill={HIGHLIGHT} opacity="0.4" />
      <g className="pose-tricep-forearm">
        <line x1="85" y1="60" x2="88" y2="90" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Deitado, só o braço oscila. Costas (dorsal). */
function PoseToalha() {
  return (
    <g>
      <Head cx={25} cy={60} />
      <line x1="35" y1="60" x2="130" y2="66" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="60" cy="58" rx="20" ry="9" fill={HIGHLIGHT} opacity="0.4" />
      <g className="pose-toalha-arm">
        <line x1="55" y1="55" x2="90" y2="30" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Sentado, pernas esticam e dobram, joelho ao cotovelo. Abdominal. */
function PoseAbdominal() {
  return (
    <g>
      <Head cx={55} cy={45} />
      <ellipse cx="65" cy="72" rx="22" ry="12" fill={HIGHLIGHT} opacity="0.4" />
      <line x1="55" y1="55" x2="70" y2="90" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      <g className="pose-abdominal-legs">
        <line x1="70" y1="90" x2="120" y2="80" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      </g>
      <line x1="55" y1="55" x2="35" y2="80" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

/** Mãos no chão, joelhos nos cotovelos, pernas no ar. Anca/pernas. */
function PoseFrog() {
  return (
    <g>
      <Head cx={45} cy={55} />
      <ellipse cx="75" cy="65" rx="24" ry="14" fill={HIGHLIGHT} opacity="0.4" />
      <line x1="55" y1="60" x2="90" y2="68" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
      <line x1="55" y1="60" x2="55" y2="95" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      <g className="pose-frog-legs">
        <line x1="90" y1="68" x2="120" y2="45" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

const POSES: Record<string, () => JSX.Element> = {
  flexao: PoseFlexao,
  elevacao: PoseElevacao,
  chinups: PoseChinups,
  dips: PoseDips,
  pique: PosePique,
  barra: PoseBarra,
  tricep: PoseTricep,
  toalha: PoseToalha,
  abdominal: PoseAbdominal,
  frog: PoseFrog,
};

export default function ExerciseIllustration({ pose }: { pose: string }) {
  const PoseComponent = POSES[pose] ?? PoseFlexao;
  return (
    <svg viewBox="0 0 160 130" width="100%" height="110" aria-hidden="true">
      <PoseComponent />
    </svg>
  );
}
