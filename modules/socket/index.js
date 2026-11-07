const usuarios = require('./usuarios').usuarios;

const filaLiberacoes = [];
const gerentesOcupados = new Set();

module.exports = function(io) {

    const liberacaoService = require('./liberacaoService')(io);

    function obterGerenteLivre() {

        for (const [id, usuario] of usuarios) {

            if (
                usuario.perfil === 'gerente' &&
                !gerentesOcupados.has(id)
            ) {
                return { id, usuario };
            }
        }

        return null;
    }

    function processarFila() {

        while (filaLiberacoes.length > 0) {

            const gerente = obterGerenteLivre();

            // não há gerentes livres
            if (!gerente) {
                return;
            }

            const pedido = filaLiberacoes.shift();

            gerentesOcupados.add(
                gerente.id
            );

//          console.log(`Enviando pedido para gerente ${gerente.id}`);

            io.to(
                gerente.usuario.socketId
            ).emit(
                'autorizacaoSolicitada',
                pedido
            );
        }

    }

    io.on('connection', socket => {

//      console.log('Socket conectado no backend:', socket.id);

        socket.on('registrar', dados => {

//      console.log('registrando (registrar socketManager): ', dados);

            usuarios.set(
                dados.userId,
                {
                    socketId: socket.id,
                    perfil: dados.perfil
                }
            );

//         console.log('registrado ok: ', usuarios );

            if (dados.perfil === 'gerente') {
                socket.join('gerentes');

                // caso existam pedidos aguardando
                processarFila();
            }

            socket.join(
                `usuario:${dados.userId}`
            );

//          console.log(`Usuário ${dados.userId} registrado`);
        });

        socket.on('solicitarAutorizacao', dados => {

            filaLiberacoes.push(dados);

//          console.log(`Pedido adicionado na fila. Total: ${filaLiberacoes.length}`);

            processarFila();
        });

        socket.on('responderAutorizacao', dados => {

            liberacaoService.responder(dados);

            // descobre qual gerente respondeu
            for (const [id, usuario] of usuarios) {

                if (
                    usuario.socketId === socket.id
                ) {

                    gerentesOcupados.delete(id);

//                  console.log(`Gerente ${id} liberado`);

                    break;
                }
            }

            // envia próximo pedido da fila
            processarFila();
        });

        socket.on('disconnect', () => {

            for (const [id, user] of usuarios) {

                if (user.socketId === socket.id) {

                    usuarios.delete(id);

                    gerentesOcupados.delete(id);

//                  console.log(`Usuário ${id} desconectado`);

                    break;
                }
            }

        });

    });

};