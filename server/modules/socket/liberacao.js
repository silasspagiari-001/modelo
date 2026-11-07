module.exports = function(io) {

    return {

        solicitar(dados) {

            console.log('solicitando liberação: ', dados);

            io.to('gerentes').emit(
                'solicitarLiberacao',
                dados
            );
        },

        responder(dados) {

            console.log('OPERADOR ID RECEBIDO:', dados.operadorId);

            console.log('ROOMS ATIVAS:', [...io.sockets.adapter.rooms.keys()]);

            io.to(`usuario:${dados.operadorId}`).emit('respostaLiberacao', dados);

        }

    };

};