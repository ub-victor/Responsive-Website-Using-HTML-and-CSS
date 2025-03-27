function getGraphQLUrl() {
    return sessionStorage.getItem('graphQlUrl')
}
var setInnerHTML = function (elm, html) {
    elm.innerHTML = html
    Array.from(elm.querySelectorAll('script')).forEach(function (oldScript) {
        var newScript = document.createElement('script')
        Array.from(oldScript.attributes).forEach(function (attr) {
            return newScript.setAttribute(attr.name, attr.value)
        })
        newScript.appendChild(document.createTextNode(oldScript.innerHTML))
        oldScript.parentNode.replaceChild(newScript, oldScript)
    })
    return elm
}
var fetchDataAndSetInnerHTML = async function (id, element, queryBody, operationName) {
    var cont = '<div id=' + id + '>'
    if (typeof queryBody === 'string') {
        queryBody = JSON.parse(queryBody)
    }
    let endpoint = getGraphQLUrl()
    const token = localStorage.getItem('AuthToken')
    const headers = {
        orgName: sessionStorage.getItem('orgName'),
        'Content-Type': 'application/json',
        'Accept-Language': localStorage.getItem('i18nextLng'),
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return fetch(endpoint, {
        headers,
        body: queryBody.body,
        method: 'POST',
    })
        .then(function (res) {
            return res.json()
        })
        .then(function (res) {
            cont += res.data[operationName] + '</div>'
            return setInnerHTML(element, cont)
        })
}
var getPage = function (event, locale) {
    event.preventDefault()
    if (locale === localStorage['i18nextLng']) return
    var loader = document.getElementById('loaderDiv')
    loader.style.display = 'block'
    var url = localStorage['currentPageUrl'] + '/' + locale + '.html'
    fetch(url)
        .then(function (res) {
            return res.text()
        })
        .then(function (res) {
            var _a, _b
            loader.style.display = 'none'
            if (res.includes('Access Denied')) {
                alert('Page is not available in ' + locale)
                ;(_a = document.getElementById('languageDropdown')) === null || _a === void 0
                    ? void 0
                    : _a.classList.toggle('active')
                return
            }
            setInnerHTML(document.body, res)
            localStorage['i18nextLng'] = locale
            ;(_b = document.getElementById(locale + '_selector')) === null || _b === void 0
                ? void 0
                : _b.classList.add('selected')
        })
}
var showLanguageDropdown = function () {
    var dropdown = document.getElementById('languageDropdown')
    dropdown === null || dropdown === void 0 ? void 0 : dropdown.classList.toggle('active')
}

const getResource = (resourceUuid) => {
    var query = `query lorResourceDownloadableLink($id: String){lorResourceDownloadableLink(id: $id)}`
    return {
        body: JSON.stringify({
            operationName: 'lorResourceDownloadableLink',
            query,
            variables: { id: resourceUuid },
        }),
    }
}

const getResourceLocationDownload = (resourceUuid) => {
    var query = `query getResourceLocationDownload($resourceId: ID!) {\n  getResourceLocationDownload(resourceId: $resourceId)\n}\n`
    return {
        body: JSON.stringify({
            operationName: 'getResourceLocationDownload',
            query,
            variables: { resourceId: resourceUuid },
        }),
    }
}

const getDownloadableLinkAndDownloadResource = async (id, lorResource = true) => {
    const GRAPHQL_URL = sessionStorage.getItem('graphQlUrl')
    const token = localStorage.getItem('AuthToken')
    const headers = {
        orgName: sessionStorage.getItem('orgName'),
        'Content-Type': 'application/json',
        'Accept-Language': localStorage.getItem('i18nextLng'),
    }
    let body, propertyName
    if (token && token != 'null') {
        headers['Authorization'] = `Bearer ${token}`
    }
    if (lorResource) {
        body = getResource(id).body
        propertyName = 'lorResourceDownloadableLink'
    } else {
        body = getResourceLocationDownload(id).body
        propertyName = 'getResourceLocationDownload'
    }
    return fetch(GRAPHQL_URL, {
        headers,
        body: body,
        method: 'POST',
    })
        .then((res) => res.json())
        .then((res) => {
            return res?.data?.[propertyName]
        })
        .catch((err) => {
            console.error(
                'Something went wrong while fetching the downloadable link name / uuid' +
                    id +
                    'and the reason is' +
                    err,
            )
        })
}

if (window.setDownloadableLink === undefined) {
    window.setDownloadableLink = async (event, id) => {
        let target = event.target
        if (event.target.nodeName !== 'A') {
            target = event.target.parentElement
        }
        if (target.getAttribute('href') == '') {
            event.preventDefault()
            console.log('getting download id', id)
            const uri = await getDownloadableLinkAndDownloadResource(id)
            console.log('downloadbale link', uri)
            target.setAttribute('download', '')
            target.setAttribute('href', uri)
            target.click()
        }
    }
}
