import { ArcadeShell } from './arcade';
import { TetrisGame } from './TetrisGame';

export default function App() {
  return (
    <ArcadeShell gameId="tetris">
      <TetrisGame />
    </ArcadeShell>
  );
}
