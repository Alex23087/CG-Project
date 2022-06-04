export let renderer: number = readCookie()

function readCookie(): number{
	let decodedCookie = decodeURIComponent(document.cookie)
	let ca = decodedCookie.split(';')
	for(let i = 0; i <ca.length; i++) {
		let c = ca[i]
		while (c.charAt(0) == ' ') {
			c = c.substring(1)
		}
		if (c.indexOf("renderer") == 0) {
			let a = parseInt(c.substring("renderer".length + 1, c.length))
			document.cookie = "renderer=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
			return a
		}
	}
	return 3
}