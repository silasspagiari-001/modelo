'use strict';

const axios = require('axios');

module.exports = {
    create: async (data, params) => {
        try {
            const queryPostarVipp = await axios({ 
                url: `http://vpsrv.visualset.com.br/api/v1/middleware/PostarObjeto`, 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'UTF-8'
                },
                data: {
                    "PerfilVipp": {
                        "Usuario": "webservice",
                        "Token": "testewebservice",
                        "IdPerfil": "604"
                    },
                    "ContratoEct": {
                        "NrContrato": "",
                        "CodigoAdministrativo": "",
                        "NrCartao": ""
                    },
                    "Destinatario": {
                        "CnpjCpf": "",
                        "IeRg": "",
                        "Nome": "Teste de WebService",
                        "SegundaLinhaDestinatario": "",
                        "Endereco": "R Conselheiro Nébias",
                        "Numero": "263",
                        "Complemento": "7º Andar ",
                        "Bairro": "",
                        "Cidade": "São Paulo",
                        "UF": "SP",
                        "Cep": "01203-001",
                        "Telefone": "",
                        "Celular": "",
                        "Email": ""
                    },
                    "Servico": {
                        "ServicoECT": ""
                    },
                    "NotasFiscais": [{
                        "DtNotaFiscal": "",
                        "SerieNotaFiscal": "",
                        "NrNotaFiscal": "",
                        "VlrTotalNota": ""
                    }],
                    "Volumes": [{
                        "Peso": "",
                        "Altura": "",
                        "Largura": "",
                        "Comprimento": "",
                        "ContaLote": "",
                        "ChaveRoteamento": "",
                        "CodigoBarraVolume": "",
                        "CodigoBarraCliente": "",
                        "ObservacaoVisual": "",
                        "ObservacaoQuatro": "",
                        "ObservacaoCinco": "",
                        "PosicaoVolume": "",
                        "Conteudo": "",
                        "DeclaracaoConteudo": {
                            "ItemConteudo": [{
                                    "DescricaoConteudo": "Teste Um da Descrição",
                                    "Quantidade": 10,
                                    "Valor": "125,98"
                                },
                                {
                                    "DescricaoConteudo": "Outro Teste da Descrição",
                                    "Quantidade": 2,
                                    "Valor": "0,99"
                                },
                                {
                                    "DescricaoConteudo": "Um Terceiro Teste da Descrição",
                                    "Quantidade": 100,
                                    "Valor": "0"
                                }
                            ],
                            "DocumentoRemetente": "",
                            "DocumentoDestinatario": ""
                        },
                        "ValorDeclarado": "",
                        "AdicionaisVolume": "",
                        "VlrACobrar": "",
                        "Etiqueta": ""
                    }]
                }
            });

            if((queryPostarVipp.data['ListaErros'] || []).length > 0){
                console.log(JSON.stringify(queryPostarVipp.data, null, 4));
                throw 'Erro ao postar objeto';
            } else {
                console.log(queryPostarVipp.data);
                console.log('Objeto postado com sucesso');
            }
            
        } catch(error) {
            const msg = 'Falha ao postar objeto VIPP';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};