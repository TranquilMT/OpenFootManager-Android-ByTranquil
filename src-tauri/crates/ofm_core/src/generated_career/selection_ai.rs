pub fn selection_score(ovr:u8,fitness:u8,morale:u8,form:i8)->i16{ovr as i16*5+fitness as i16+morale as i16/2+form as i16*4}pub fn available(injured:bool,suspended:bool)->bool{!injured&&!suspended}
