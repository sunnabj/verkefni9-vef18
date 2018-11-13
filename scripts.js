/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

const API_URL = 'https://apis.is/isnic?domain=';

/**
 * Leit að lénum á Íslandi gegnum apis.is
 */
const program = (() => {
  let input;
  let results; // Tómt div í html-inu sem við stingum niðurstöðum inn í.

  /**
   * Býr til nýtt element
   * type = gerð af elementi
   * text = Textinn í elementinu (ef á við)
   */
  function el(type, text) {
    const element = document.createElement(type);
    if (text) {
      element.appendChild(document.createTextNode(text));
    }
    return element;
  }
  /**
   * Bætir við loading klasa með loading gif og texta.
   */
  function showLoading() {
    const img = el('img');
    img.setAttribute('alt', 'loading gif');
    img.setAttribute('src', 'loading.gif');

    const imageDiv = el('div');
    imageDiv.classList.add('loading');
    imageDiv.appendChild(img);

    const text = el('span', 'Leita að léni...');
    imageDiv.appendChild(text);

    results.appendChild(imageDiv);
  }
  /**
   * Eyðir öllu úr divi sem kemur inn sem argument.
   * Ætlað til þess að hreinsa skjáinn.
   */
  function erase(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
  /**
  * Birtir texta á skjánum með því að búa til nýtt texta element.
  */
  function showMessage(message) {
    erase(results);
    const d1Element = document.createElement('dl');
    const dd = el('dd', message);
    d1Element.appendChild(dd);
    results.appendChild(d1Element);
  }
  /**
   * Tekur inn tölugildi og breytir því í dagsetningu. Sé dagsetningin lögleg
   * er henni breytt yfir á YYYY-MM-DD form og því skilað, annars er upphaflega
   * gildinu skilað.
   * Notað til að breyta dagsetningum í niðurstöðum á rétt form.
   */
  function dateParse(value) {
    const keySeconds = Date.parse(value);
    const keyDate = new Date(keySeconds);
    if (!Number.isNaN(keyDate.getUTCMonth())) {
      const keyDay = keyDate.getUTCDate();
      const keyMonth = keyDate.getUTCMonth() + 1;
      const keyYear = keyDate.getUTCFullYear();

      const fullDate = `${keyYear}-${keyMonth}-${keyDay}`;
      return fullDate;
    }
    return value;
  }

  /**
   * Tekur inn gögnin sem voru sótt á netið með fetch fallinu (sjá neðar),
   * meðhöndlar þau og setur niðurstöðurnar inn í html-ið og sýnir þær þar með.
   */
  function showResults(data) {
    erase(results);
    // Ef fetch skilar engum niðurstöðum er lénið ekki skráð.
    if (data.length === 0) {
      showMessage('Lén er ekki skráð');
    }

    const dataObj = data[0]; // Gögnin sem við höfum áhuga á eru í fyrsta stakinu í data.
    const dlElement = document.createElement('dl'); // Heldur utan um heildarlistann.

    let dd; // Elementið, til dæmis lén, heimilisfang, o.s.frv.
    let dt; // Gildið á elementinu, til dæmis hi.is og Sæmundargötu 2.
    let count = 0; // Upphafsstillum teljara áður en við ítrum í gegnum gögnin.

    // Listi sem inniheldur íslenskar þýðingar á nöfnum elementa í dataObj hlutnum.
    const icelandicList = ['Lén', 'Skráningaraðili', 'Heimilisfang', '', '', 'Land', '', 'Netfang', 'Skráð', 'Rennur út', 'Seinast breytt'];

    /**
     * Ítrum nú í gegnum gögnin. Key er hvert stak í dataObj, þ.e. element,
     * og dataObj[key] þá viðkomandi gildi.
     * Í hverri ítrun fer teljarinn upp um 1. Við vitum hvaða element er númer hvað
     * og getum gert mismunandi hluti fyrir mismunandi element því teljarinn veit
     * hvar við erum staðsett.
     */
    for (let key in dataObj) {
      /**
       * Við birtum aldrei upplýsingar fyrir city, postalCode og phone, þ.e. nr 3, 4 og 6.
       * Fyrir rest er lén, skráð, seinast breytt og rennur út alltaf birt, nr. 0, 8, 9 og 10,
       * en þau element sem eftir eru, þ.e. skráningaraðili, netfang, heimilisfang og land
       * eru aðeins birt ef þau eru skilgreind, þ.e. ekki tóm.
       * Ef við höfum gildi sem byrjar á tölu er athugað hvort það sé dagsetning og ef svo er
       * er henni breytt yfir á YYYY-MM-DD form.
       * Loks er elementunum á íslensku og viðkomandi gildum bætt í results hlutinn.
       */
      if (count !== 3 && count !== 4 && count !== 6) {
        if (count === 0 || count === 8 || count === 9 || count === 10 || dataObj[key] !== '') {
          if (/^\d/.test(dataObj[key])) {
            dataObj[key] = dateParse(dataObj[key]);
          }
          dt = el('dt', dataObj[key]);
          key = icelandicList[count];

          dd = el('dd', key);
          dlElement.appendChild(dd);
          dlElement.appendChild(dt);
        }
      }
      count += 1;
    }
    results.appendChild(dlElement);
  }
  /**
   * Fall sem tekur inn vefsíðu (streng úr leitarboxi) og sækir gögn sem eiga við síðuna.
   * Sé tenging í ólagi er villu kastað, annars eru gögnin send inn í showResults fallið og sýnd.
   */
  function fetchResults(website) {
    fetch(`${API_URL}${website}`)
      .then((data) => {
        if (!data.ok) {
          throw new Error('Non 200 status'); // Ef ekki í lagi með gögnin
        }
        return data.json(); // Skilar gögnum á json formi.
      })
      .then(data => showResults(data.results))
      .catch((error) => {
        console.error('ERROR', error);
        showMessage('Villa við að sækja gögn');
      });
  }
  /**
   * Atburðahandler fyrir takkann sem ýtt er á til að leita eftir léni.
   * Ef notandi setur ekki inn tóman streng (eða bara bil) er strengurinn/vefsíðan
   * notaður til að leita að sækja gögn í gegnum fetchResults.
   * Loading texti og gif eru sýnd á meðan leitað er og þeim niðurstöðum sem
   * ef til vill fyrir voru er eytt.
   */
  function onSubmit(e) {
    e.preventDefault();
    erase(results);
    let website = input.value;

    website = website.trim();

    if (website === '') {
      showMessage('Lén verður að vera strengur');
    } else {
      fetchResults(website);
      showLoading();
    }
  }

  /**
   * Byrjar þetta allt saman með því að skilgreina results og setja atburðarhandler
   * á leitartakkann.
   */
  function init(domains) {
    const form = domains.querySelector('form');
    input = form.querySelector('input');
    results = domains.querySelector('.results');

    form.addEventListener('submit', onSubmit);
  }


  return {
    init,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  const domains = document.querySelector('.domains');
  program.init(domains);
});
