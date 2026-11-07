module.exports = function(io) {

    return {
        //  envia resposta para usuário original
        responder(dados) {

            if (!dados.operadorId) {
                console.error('Resposta sem operadorId:', dados);
                return;
            }

            console.log('RESPONDENDO:', dados);

            io.to(`usuario:${dados.operadorId}`).emit('autorizacaoRespondida', dados);
        }

    };

};