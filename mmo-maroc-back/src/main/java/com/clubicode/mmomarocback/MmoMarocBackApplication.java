package com.clubicode.mmomarocback;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MmoMarocBackApplication {

    public static void main(String[] args) {
        SpringApplication.run(MmoMarocBackApplication.class, args);
    }

}
