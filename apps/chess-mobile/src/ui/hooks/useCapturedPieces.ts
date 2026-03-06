import { useMemo } from 'react';
import { CapturedPiecesLogic, CapturedPiecesViewModel } from '../viewmodels/CapturedPiecesViewModel';
import { BoardViewModel, Piece } from 'chess-core';

export const useCapturedPieces = (viewModel: BoardViewModel): CapturedPiecesViewModel => {
    return useMemo(() => {
        if (!viewModel.capturedPieces) {
            return {
                topRow: { labelKey: 'game.piecesLost', pieces: [] },
                bottomRow: { labelKey: 'game.piecesCaptured', pieces: [] }
            };
        }

        return CapturedPiecesLogic.calculate(
            viewModel.capturedPieces.black as Piece[], // Captured BY white (black pieces)
            viewModel.capturedPieces.white as Piece[], // Captured BY black (white pieces)
            'white' // Constant 'white' perspective for local game as requested
        );
    }, [viewModel.capturedPieces]);
};

