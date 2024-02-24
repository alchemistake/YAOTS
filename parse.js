// Taken mostly from the pokemon showdown calc.
// https://github.com/smogon/damage-calc

function parse(){
	fetch("base.pdf")
    .then((res) => res.arrayBuffer())
    .then((buffer) => {
        PDFLib.PDFDocument.load(buffer).then(pdfDoc => {
            const form = pdfDoc.getForm();
            paste = document.getElementById("paste").value;
			pokes = parseSet(paste);

			for(var i = 0; i < pokes.length; i++){
				poke = pokes[i];
				first_post_fix = i == 0 ? "" : `_${i+1}`;
				second_post_fix = `_${i+7}`;

				form.getField(`Pokémon${first_post_fix}`).setText(poke.name);
				form.getField(`Pokémon${second_post_fix}`).setText(poke.name);

				form.getField(`Tera Type${first_post_fix}`).setText(poke.teraType);
				form.getField(`Tera Type${second_post_fix}`).setText(poke.teraType);

				form.getField(`Ability${first_post_fix}`).setText(poke.ability);
				form.getField(`Ability${second_post_fix}`).setText(poke.ability);

				form.getField(`Held Item${first_post_fix}`).setText(poke.item);
				form.getField(`Held Item${second_post_fix}`).setText(poke.item);

				form.getField(`Level${first_post_fix}`).setText(poke.level.toString());
				form.getField(`HP${first_post_fix}`).setText(poke.rawStats.hp.toString());
				form.getField(`Atk${first_post_fix}`).setText(poke.rawStats.atk.toString());
				form.getField(`Def${first_post_fix}`).setText(poke.rawStats.def.toString());
				form.getField(`Sp Atk${first_post_fix}`).setText(poke.rawStats.spa.toString());
				form.getField(`Sp Def${first_post_fix}`).setText(poke.rawStats.spd.toString());
				form.getField(`Speed${first_post_fix}`).setText(poke.rawStats.spe.toString());
				
				form.getField(`Move 1${first_post_fix}`).setText(poke.moves[0]);
				form.getField(`Move 1${second_post_fix}`).setText(poke.moves[0]);

				form.getField(`Move 2${first_post_fix}`).setText(poke.moves[1]);
				form.getField(`Move 2${second_post_fix}`).setText(poke.moves[1]);

				form.getField(`Move 3${first_post_fix}`).setText(poke.moves[2]);
				form.getField(`Move 3${second_post_fix}`).setText(poke.moves[2]);

				form.getField(`Move 4${first_post_fix}`).setText(poke.moves[3]);
				form.getField(`Move 4${second_post_fix}`).setText(poke.moves[3]);
			}

			pdfDoc.save().then(data => {
				download(data, "filled_ots_check_before_printing.pdf", "application/pdf");
			});
        })
    });
}

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

function parseSet(pokes) {
    var rows = pokes.split("\n");
    var currentRow;
    var currentPoke;
	var pokes = [];
    for (var i = 0; i < rows.length; i++) {
        currentRow = rows[i].split(/[()@]/);
        for (var j = 0; j < currentRow.length; j++) {
            currentRow[j] = checkExeptions(currentRow[j].trim());
            if (calc.SPECIES[9][currentRow[j].trim()] !== undefined) {
                currentPoke = calc.SPECIES[9][currentRow[j].trim()];
                currentPoke.name = currentRow[j].trim();
                currentPoke.item = getItem(currentRow, j + 1);
                currentPoke.nameProp = "";
                currentPoke.isCustomSet = true;
                currentPoke.ability = getAbility(rows[i + 1].split(":"));
                currentPoke.teraType = getTeraType(rows[i + 1].split(":"));
                currentPoke = getStats(currentPoke, rows, i + 1);
                currentPoke = getMoves(currentPoke, rows, i);
				a = new calc.Pokemon(calc.Generations.get(9), currentPoke.name, currentPoke);
				pokes.push(a);
            }
        }
    }
	return pokes;
}

function checkExeptions(poke) {
    switch (poke) {
        case 'Aegislash':
            poke = "Aegislash-Blade";
            break;
        case 'Basculin-Blue-Striped':
            poke = "Basculin";
            break;
        case 'Gastrodon-East':
            poke = "Gastrodon";
            break;
        case 'Mimikyu-Busted-Totem':
            poke = "Mimikyu-Totem";
            break;
        case 'Mimikyu-Busted':
            poke = "Mimikyu";
            break;
        case 'Pikachu-Belle':
        case 'Pikachu-Cosplay':
        case 'Pikachu-Libre':
        case 'Pikachu-Original':
        case 'Pikachu-Partner':
        case 'Pikachu-PhD':
        case 'Pikachu-Pop-Star':
        case 'Pikachu-Rock-Star':
            poke = "Pikachu";
            break;
        case 'Vivillon-Fancy':
        case 'Vivillon-Pokeball':
            poke = "Vivillon";
            break;
        case 'Florges-White':
        case 'Florges-Blue':
        case 'Florges-Orange':
        case 'Florges-Yellow':
            poke = "Florges";
            break;
        case 'Shellos-East':
            poke = "Shellos";
            break;
        case 'Deerling-Summer':
        case 'Deerling-Autumn':
        case 'Deerling-Winter':
            poke = "Deerling";
            break;
    }
    return poke;
}

function getAbility(row) {
	var ability = row[1] ? row[1].trim() : '';
	if (calc.ABILITIES[9].indexOf(ability) !== -1) return ability;
}

function getTeraType(row) {
	var teraType = row[1] ? row[1].trim() : '';
	if (Object.keys(calc.TYPE_CHART[9]).slice(1).indexOf(teraType) !== -1) return teraType;
}

function getStats(currentPoke, rows, offset) {
	currentPoke.nature = "Serious";
	var currentEV;
	var currentIV;
	var currentAbility;
	var currentTeraType;
	var currentNature;
	currentPoke.level = 100;
	for (var x = offset; x < offset + 9; x++) {
		var currentRow = rows[x] ? rows[x].split(/[/:]/) : '';
		var evs = {};
		var ivs = {};
		var ev;
		var j;

		switch (currentRow[0]) {
		case 'Level':
			currentPoke.level = parseInt(currentRow[1].trim());
			break;
		case 'EVs':
			for (j = 1; j < currentRow.length; j++) {
				currentEV = currentRow[j].trim().split(" ");
				currentEV[1] = statToLegacyStat(currentEV[1].toLowerCase());
				evs[currentEV[1]] = parseInt(currentEV[0]);
			}
			currentPoke.evs = evs;
			break;
		case 'IVs':
			for (j = 1; j < currentRow.length; j++) {
				currentIV = currentRow[j].trim().split(" ");
				currentIV[1] = statToLegacyStat(currentIV[1].toLowerCase());
				ivs[currentIV[1]] = parseInt(currentIV[0]);
			}
			currentPoke.ivs = ivs;
			break;

		}
		currentAbility = rows[x] ? rows[x].trim().split(":") : '';
		if (currentAbility[0] == "Ability") {
			currentPoke.ability = currentAbility[1].trim();
		}

		currentTeraType = rows[x] ? rows[x].trim().split(":") : '';
		if (currentTeraType[0] == "Tera Type") {
			currentPoke.teraType = currentTeraType[1].trim();
		}

		currentNature = rows[x] ? rows[x].trim().split(" ") : '';
		if (currentNature[1] == "Nature") {
			currentPoke.nature = currentNature[0];
		}
	}
	return currentPoke;
}

function getItem(currentRow, j) {
	for (;j < currentRow.length; j++) {
		var item = currentRow[j].trim();
		if (calc.ITEMS[9].indexOf(item) != -1) {
			return item;
		}
	}
}

function getMoves(currentPoke, rows, offset) {
	var movesFound = false;
	var moves = [];
	for (var x = offset; x < offset + 12; x++) {
		if (rows[x]) {
			if (rows[x][0] == "-") {
				movesFound = true;
				var move = rows[x].substr(2, rows[x].length - 2).replace("[", "").replace("]", "").replace("  ", "");
				moves.push(move);
			} else {
				if (movesFound == true) {
					break;
				}
			}
		}
	}
	currentPoke.moves = moves;
	return currentPoke;
}

function statToLegacyStat(stat) {
	switch (stat) {
	case 'hp':
		return "hp";
	case 'atk':
		return "at";
	case 'def':
		return "df";
	case 'spa':
		return "sa";
	case 'spd':
		return "sd";
	case 'spe':
		return "sp";
	}
}