'use strict';

const svgCaptcha = require('svg-captcha');

module.exports = {
    read: async (params) => {
        try {
            const captcha = svgCaptcha.create({
                size: 6,
                ignoreChars: '0oO1iIl',
                noise: 6,
                height: 80
            });

            return {
                text: captcha.text,
                data: captcha.data
            }
            
        } catch(error) {
            const msg = error.message ? 'Falha ao gerar captcha' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
