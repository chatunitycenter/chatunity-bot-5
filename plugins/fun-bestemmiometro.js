//Plugin by Gabs

let handler = async (chatUpdate) => {
  let userStats = global.db.data.users[chatUpdate.sender];
  if (!chatUpdate.text) return null;

  const profanityRegex = /(?:porco dio|porcodio|dio bastardo|dio cane|porcamadonna|madonnaporca|porca madonna|madonna porca|dio cristo|diocristo|dio maiale|diomaiale|jesucristo|jesu cristo|cristo madonna|madonna impanata|dio cristo|cristo dio|dio frocio|dio gay|dio madonna|dio infuocato|dio crocifissato|madonna puttana|madonna vacca|madonna inculata|maremma maiala|padre pio|jesu impanato|jesu porco|porca madonna|diocane|madonna porca|dio capra|capra dio|padre pio ti spio)/i;

  if (!userStats.bestemmiometro) return null;

  if (profanityRegex.test(chatUpdate.text)) {
    userStats.blasphemy = (userStats.blasphemy || 0) + 1;

    if (userStats.blasphemy === 100) {
      const mentionJID = '@' + chatUpdate.sender.split('@')[0] + '@s.whatsapp.net';
      const warningText = `${mentionJID} ha raggiunto 100 bestemmie`;

      let quotedMsg = {
        key: {
          participants: '0@s.whatsapp.net',
          fromMe: false,
          id: 'system-warning'
        },
        message: {
          locationMessage: {
            name: 'Unlimited',
            jpegThumbnail: await (await fetch('https://telegra.ph/file/ba01cc1e5bd64ca9d65ef.jpg')).buffer(),
            vcard:
              'BEGIN:VCARD\n' +
              'VERSION:3.0\n' +
              'N:;Unlimited;;;\n' +
              'FN:Unlimited\n' +
              'ORG:Unlimited\n' +
              'TITLE:\n' +
              'item1.TEL;waid=19709001746:+1 (970) 900-1746\n' +
              'item1.X-ABLabel:Unlimited\n' +
              'X-WA-BIZ-DESCRIPTION:ofc\n' +
              'X-WA-BIZ-NAME:Unlimited\n' +
              'END:VCARD'
          }
        },
        participant: '0@s.whatsapp.net'
      };

      await conn.sendMessage(
        chatUpdate.chat,
        {
          text: warningText,
          mentions: [mentionJID]
        },
        { quoted: quotedMsg }
      );
    }

    if (userStats.blasphemy > 100) {
      const mentionJID = '@' + chatUpdate.sender.split('@')[0] + '@s.whatsapp.net';
      const knockOutText = `${mentionJID} ha fatto ${userStats.blasphemy} bestemmie`;

      let quotedMsg2 = {
        key: {
          participants: '0@s.whatsapp.net',
          fromMe: false,
          id: 'system-knockout'
        },
        message: {
          locationMessage: {
            name: 'Unlimited',
            jpegThumbnail: await (await fetch('https://telegra.ph/file/ba01cc1e5bd64ca9d65ef.jpg')).buffer(),
            vcard:
              'BEGIN:VCARD\n' +
              'VERSION:3.0\n' +
              'N:;Unlimited;;;\n' +
              'FN:Unlimited\n' +
              'ORG:Unlimited\n' +
              'TITLE:\n' +
              'item1.TEL;waid=19709001746:+1 (970) 900-1746\n' +
              'item1.X-ABLabel:Unlimited\n' +
              'X-WA-BIZ-DESCRIPTION:ofc\n' +
              'X-WA-BIZ-NAME:Unlimited\n' +
              'END:VCARD'
          }
        },
        participant: '0@s.whatsapp.net'
      };

      await conn.sendMessage(
        chatUpdate.chat,
        {
          text: knockOutText,
          mentions: [mentionJID]
        },
        { quoted: quotedMsg2 }
      );
    }
  }
};

export default handler;