function bjorklund(slots, pulses){
  var pattern = [],
      count = [],
      remainder = [pulses],
      divisor = slots - pulses,
      level = 0,
      build_pattern = function(lv){
        if( lv == -1 ){ pattern.push(0); }
        else if( lv == -2 ){ pattern.push(1); }
        else {
          for(var x=0; x<count[lv]; x++){
            build_pattern(lv-1);
          }

          if(remainder[lv]){
            build_pattern(lv-2);
          }
        }
      }
  ;

  while(remainder[level] > 1){
    count.push(Math.floor(divisor/remainder[level]));
    remainder.push(divisor%remainder[level]);
    divisor = remainder[level];
    level++;
  }
  count.push(divisor);

  build_pattern(level);

  return pattern.reverse();
}


var bjork = function(m, k){
  if(m > k) return bjorklund(m, k);
  else return bjorklund(k, m);
};

export default bjork;
