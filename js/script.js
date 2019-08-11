$.ajax({
  url: "https://api.royaleapi.com/clan/P9UY2Y0U",
  method: "GET",
  dataType: "json",
  crossDomain: true,
  contentType: "application/json; charset=utf-8",
  beforeSend: function (xhr) {
  	$('#loading').show();
    /* Authorization header */
    xhr.setRequestHeader("Authorization", "Bearer <privateKey>");
  },
	error: function(jqXHR, textStatus, errorThrown) {
    alert('Something terrible has happened. The API is likely down. Try again in 30 or at a later time.');
  },
  success: function (data) {
  	let memKeys = {};
  	let memTags = [];
  	let finalCardCounts = {};
  	let finalLixCount = [];
  	let tableData = {};
  	data.members.map((member => {
  		if(!memKeys[member.tag]){
  			memTags.push(member.tag);
  			memKeys[member.tag] = {};
  		}	else {
  			memKeys[member.tag] = {};
  		}
  	}));

		$.ajax({
	    url: "https://api.royaleapi.com/player/" + memTags.join(","),
	    method: "GET",
	    dataType: "json",
	    crossDomain: true,
	    contentType: "application/json; charset=utf-8",
	    beforeSend: function (xhr) {
	        xhr.setRequestHeader("Authorization", "Bearer <privateKey>");
	    },
      error: function(jqXHR, textStatus, errorThrown) {
          alert('Something terrible has happened. The API is likely down. Try again in 30 or at a later time.');
      },
	    success: function (data) {
	    	$('#loading').hide();
	    	for(let i=0; i<data.length; i++){
					for(let j=0; j<data[i].cards.length; j++){
						if(!finalLixCount.includes(data[i].cards[j].elixir)){
							finalLixCount.push(data[i].cards[j].elixir);
						}
						if(!finalCardCounts[data[i].cards[j].name]){
							finalCardCounts[data[i].cards[j].name] = {};
							finalCardCounts[data[i].cards[j].name].assets = 
							{
								"name": data[i].cards[j].name,
								"avgLevel": 0,
								"imgSrc": data[i].cards[j].icon,
								"cardType": data[i].cards[j].type,
								"cardRarity": data[i].cards[j].rarity,
								"elixir": data[i].cards[j].elixir
							};

							finalCardCounts[data[i].cards[j].name].players = {};
							finalCardCounts[data[i].cards[j].name].players[data[i].name] = {
								"leftToMax": 0,
								"leftToUpgrade": data[i].cards[j].leftToUpgrade,
								"currentLevel": data[i].cards[j].displayLevel,
								"count": data[i].cards[j].count
							};									
						} else {
							finalCardCounts[data[i].cards[j].name].players[data[i].name] = {
								"leftToMax": 0,
								"leftToUpgrade": data[i].cards[j].leftToUpgrade,
								"currentLevel": data[i].cards[j].displayLevel,
								"count": data[i].cards[j].count
							};
						}
					}
				}

				finalLixCount.sort();
				finalLixCount.forEach((lixCount => {
					$('#card-selector').append(`
						<div class="lix-filter-wrapper" data-elixir="${lixCount}">
					    <div class="lix-filter-icon" data-elixir="${lixCount}">${lixCount}</div>
					  </div>
					`);
				}))
				let cards = Object.keys(finalCardCounts);
				cards.map((card => {
					let cardData = finalCardCounts[card];
					tableData[card] = [];
					Object.keys(cardData.players).map((player => {
						let rowEntry = {
							cardName: null,
							playerName: null,
							currentLevel: null,
							leftToMax: null,
							leftToUpgrade: null,
							count: null
						};
						rowEntry.cardName = cardData.assets.name;
						rowEntry.playerName = player;
						rowEntry.currentLevel = cardData.players[player].currentLevel;
						rowEntry.leftToMax = findLeftToMax(cardData.assets.cardRarity,cardData.players[player].count,cardData.players[player].currentLevel);
						rowEntry.leftToUpgrade = convertUndefined(cardData.players[player].leftToUpgrade);
						rowEntry.count = cardData.players[player].count;
						tableData[card].push(rowEntry);
					}))	
				}));

				let ourDataTable = $('#card-data-table').dataTable( {
				    "data": null,
				    "columns": [
				        { "data": "cardName" },
				        { "data": "playerName" },
				        { "data": "currentLevel" },
				        { "data": "leftToMax" },
				        { "data": "leftToUpgrade" },
				        { "data": "count" }
				    ],								
				    "searching": false,
						"paging": false,
						"order": [ 3, 'asc' ],
						"columnDefs": [
	            {
	               "targets": [ 0 ],
	               "visible": false
	            }
        		],
        		"responsive": true
				});

				cards.forEach((card => {
					if(finalCardCounts[card].assets.elixir){
						$('#card-selection').append(`
							<img class="card-thumb" data-name="${finalCardCounts[card].assets.name}" data-elixir="${finalCardCounts[card].assets.elixir}" src="${finalCardCounts[card].assets.imgSrc}" alt="${finalCardCounts[card].assets.name}">
						`);								
					}
				}));

				$('.card-thumb').click(function () {
					$('#card-data-table').dataTable().fnClearTable();
					$('#card-data-table').dataTable().fnAddData(tableData[$(this).data('name')]);
				});

				$('.lix-filter-wrapper').click(function(){
					$(this).toggleClass('active');
					$('.card-thumb').hide();
					$('.lix-filter-wrapper.active').each(function (index, value) {
						$('#card-selection > [data-elixir="' + $(this).data('elixir') + '"]').show();
					});
				});
				
				$('.card-thumb').click(function(){
					$('#card-data-table').show();
					$('.card-name').text($(this).data('name'));
					$('.card-thumb').removeClass('active');
					$(this).addClass('active');
				});
	    }
	  })
	}
});

function convertUndefined(val){
	return val != undefined ? val : "Max";
}

let upgradeValues = {
	"Common": [2,4,10,20,50,100,200,400,800,1000,2000,5000],
  "Rare": [0,0,2,4,10,20,50,100,200,400,800,1000],
  "Epic": [0,0,0,0,0,2,4,10,20,50,100,200],
  "Legendary": [0,0,0,0,0,0,0,0,2,4,10,20]
}		

function findLeftToMax(cardRarity, cardCounts, cardLevel){
	let baseMaxCount = 0;
  for(let i=cardLevel-1;i<12;i++){
  	baseMaxCount += upgradeValues[cardRarity][i];
  }
	return baseMaxCount - cardCounts;
}